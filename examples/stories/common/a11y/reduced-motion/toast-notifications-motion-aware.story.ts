import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxReducedMotion: Toast notifications motion-aware',
  subtitle:
    'Notifications slide in by default, or appear instantly when <code>prefersReducedMotion()</code> is <code>true</code>. The signal drives the conditional class binding directly from the template, which is the path to take when CSS alone cannot decide.',
  description:
    'Same directive, signal-in-TypeScript variant: the toast row gets the <code>cngx-ex-toast--animate</code> class only when motion is allowed. The conditional is on the binding, not in CSS, because a real consumer might also use the signal to skip a confetti effect, shorten an auto-dismiss timer, or refuse to autoplay video. The CSS-hook sibling shows the simpler path for pure-style cases.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: ['CngxReducedMotion'],
  imports: ['CngxReducedMotion'],
  references: [
    {
      label: 'WCAG 2.1 SC 2.3.3 Animation from Interactions',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html',
    },
    {
      label: 'CSS Media Queries Level 5: prefers-reduced-motion',
      href: 'https://drafts.csswg.org/mediaqueries-5/#prefers-reduced-motion',
    },
  ],
  setup: `protected readonly notifications = signal<{ id: number; text: string }[]>([]);
  private nextId = 0;
  protected addNotification(): void {
    const id = this.nextId++;
    const texts = [
      'Order shipped successfully',
      'New comment on your post',
      'Payment received: $42.00',
      'Backup completed',
      'Profile updated',
    ];
    this.notifications.update((list) => [...list, { id, text: texts[id % texts.length] }]);
    setTimeout(() => this.removeNotification(id), 4000);
  }
  protected removeNotification(id: number): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }`,
  template: `  <div cngxReducedMotion #rm="cngxReducedMotion">
    <button type="button" class="chip" (click)="addNotification()">Add notification</button>

    <ul class="cngx-ex-toast-list">
      @for (n of notifications(); track n.id) {
        <li class="cngx-ex-toast" [class.cngx-ex-toast--animate]="!rm.prefersReducedMotion()">
          <span>{{ n.text }}</span>
          <button type="button" class="chip" (click)="removeNotification(n.id)">dismiss</button>
        </li>
      } @empty {
        <li class="cngx-ex-toast-list__empty">
          No notifications. Click the button above to add one.
        </li>
      }
    </ul>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active notifications</span>
      <span class="event-value">{{ notifications().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Animation</span>
      <span class="event-value">{{ rm.prefersReducedMotion() ? 'instant (no motion)' : 'slide-in 0.3s' }}</span>
    </div>
  </div>`,
};
