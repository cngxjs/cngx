import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Toast Notifications — Motion-aware',
  subtitle: 'Notifications that slide in with animation, or appear instantly when <code>prefersReducedMotion()</code> is <code>true</code>. This demonstrates using the signal in TypeScript logic, not just CSS.',
  description: 'Reads the prefers-reduced-motion media query and adds the cngx-reduced-motion CSS class when the user prefers reduced motion.',
  level: 'atom',
  audience: ['a11y', 'dev'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxReducedMotion',
  ],
  imports: ['CngxReducedMotion'],
  setup: `protected notifications = signal<{ id: number; text: string }[]>([]);
  private _nextId = 0;
  protected addNotification(): void {
    const id = this._nextId++;
    const texts = [
      'Order shipped successfully',
      'New comment on your post',
      'Payment received — $42.00',
      'Backup completed',
      'Profile updated',
    ];
    this.notifications.update(list => [
      ...list,
      { id, text: texts[id % texts.length] },
    ]);
    setTimeout(() => this.removeNotification(id), 4000);
  }
  protected removeNotification(id: number): void {
    this.notifications.update(list => list.filter(n => n.id !== id));
  }`,
  template: `
  <div cngxReducedMotion #rm2="cngxReducedMotion">
    <button class="sort-btn" (click)="addNotification()">
      Add notification
    </button>

    <div style="
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 60px;
    ">
      @for (n of notifications(); track n.id) {
        <div
          style="
            padding: 10px 14px;
            border-radius: 6px;
            background: var(--cngx-surface-alt, #f8f9fa);
            border: 1px solid var(--cngx-color-border, #ddd);
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.8125rem;
          "
          [style.animation]="rm2.prefersReducedMotion() ? 'none' : 'cngx-demo-slide-in 0.3s ease-out'"
        >
          <span>{{ n.text }}</span>
          <button
            class="sort-btn"
            style="padding: 2px 8px; font-size: 0.75rem;"
            (click)="removeNotification(n.id)"
          >dismiss</button>
        </div>
      } @empty {
        <div style="
          padding: 16px;
          text-align: center;
          color: var(--cngx-text-secondary, #999);
          font-size: 0.8125rem;
        ">
          No notifications. Click the button above to add one.
        </div>
      }
    </div>

    <div class="event-grid" style="margin-top: 12px">
      <div class="event-row">
        <span class="event-label">Active notifications</span>
        <span class="event-value">{{ notifications().length }}</span>
      </div>
      <div class="event-row">
        <span class="event-label">Animation</span>
        <span class="event-value">{{ rm2.prefersReducedMotion() ? 'instant (no motion)' : 'slide-in 0.3s' }}</span>
      </div>
    </div>
  </div>`,
};
