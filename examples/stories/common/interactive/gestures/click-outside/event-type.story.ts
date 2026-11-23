import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxClickOutside: event type',
  subtitle: '<code>[eventType]</code> picks the document event the directive listens to: <code>pointerdown</code> (default), <code>click</code>, <code>mousedown</code> or <code>touchstart</code>. Press outside the box and hold: <code>pointerdown</code> counts on press, <code>click</code> only on release.',
  description: 'The default <code>pointerdown</code> closes a popup before the press lands anywhere else, which is what a dropdown usually wants. <code>click</code> waits for a full press and release, so a press that starts outside and is dragged away does not count. Switching the type swaps the document listener; the readout shows the last event that fired.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxClickOutside',
  ],
  moduleImports: [
    'import { CngxClickOutside } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxClickOutside'],
  setup: `protected readonly eventTypes = ['pointerdown', 'click', 'mousedown', 'touchstart'] as const;
  protected readonly eventType = signal<'pointerdown' | 'click' | 'mousedown' | 'touchstart'>('pointerdown');
  protected readonly count = signal(0);
  protected readonly lastEvent = signal('none');
  protected handleOutside(event: Event): void {
    this.count.update((n) => n + 1);
    this.lastEvent.set(event.type);
  }`,
  template: `  <div
    cngxClickOutside
    [eventType]="eventType()"
    (clickOutside)="handleOutside($event)"
    class="demo-gesture-panel"
    style="max-width:280px"
  >
    Press anywhere outside this box.
  </div>`,
  templateChrome: `<div class="button-row" style="margin-top:12px" role="group" aria-label="Event type">
    @for (type of eventTypes; track type) {
      <button type="button" class="chip" [attr.aria-pressed]="eventType() === type" (click)="eventType.set(type)">{{ type }}</button>
    }
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">Outside presses</span>
      <span class="event-value">{{ count() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Last event</span>
      <span class="event-value">{{ lastEvent() }}</span>
    </div>
  </div>`,
};
