import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'SwipeDismiss',
  navLabel: 'SwipeDismiss',
  navCategory: 'interactive',
  description:
    'Detects directional swipe gestures via Pointer Events. Emits when the gesture exceeds a threshold. Exposes swiping and progress signals.',
  apiComponents: ['CngxSwipeDismiss'],
  moduleImports: [
    "import { CngxSwipeDismiss, type SwipeDirection } from '@cngx/common';",
  ],
  setup: `
  protected readonly swipeDir = signal<SwipeDirection>('left');
  protected readonly swipeDirs: SwipeDirection[] = ['left', 'right', 'up', 'down'];
  protected readonly swipeCount = signal(0);
  protected readonly lastProgress = signal(0);
  `,
  sections: [
    {
      title: 'CngxSwipeDismiss — Directional Swipe',
      subtitle:
        'Swipe the box in the selected direction to trigger dismissal. ' +
        '<code>swipeProgress</code> updates in real time during the gesture (0 to 1). ' +
        '<code>(swiped)</code> emits when the threshold is exceeded.',
      imports: ['CngxSwipeDismiss'],
      template: `
  <div class="filter-row">
    <span class="filter-label">Direction:</span>
    @for (d of swipeDirs; track d) {
      <button class="chip" [class.chip--active]="swipeDir() === d"
              (click)="swipeDir.set(d)">{{ d }}</button>
    }
  </div>

  <div [cngxSwipeDismiss]="swipeDir()" #swipe="cngxSwipeDismiss"
       [threshold]="60"
       (swiped)="swipeCount.update(n => n + 1)"
       style="
         touch-action: none;
         user-select: none;
         padding: 2rem;
         border: 2px dashed var(--cngx-border, #ccc);
         border-radius: 8px;
         text-align: center;
         margin-top: 0.75rem;
         cursor: grab;
         background: var(--cngx-surface-alt, #f9fafb);
         transition: transform 0.1s ease;
       "
       [style.transform]="swipe.swiping() ? 'scale(0.98)' : 'scale(1)'"
       [style.border-color]="swipe.swiping() ? 'var(--interactive, #f5a623)' : ''">
    <p style="margin: 0; font-size: 1.25rem; font-weight: 600">
      Swipe {{ swipeDir() }}
    </p>
    <p style="margin: 0.5rem 0 0; font-size: 0.875rem; color: var(--text-muted, #888)">
      threshold: 60px
    </p>
  </div>

  <div class="status-row" style="margin-top: 0.75rem;">
    <span class="status-badge" [class.active]="swipe.swiping()">
      {{ swipe.swiping() ? 'swiping' : 'idle' }}
    </span>
    <span class="status-badge">
      progress: {{ (swipe.swipeProgress() * 100).toFixed(0) }}%
    </span>
    <span class="status-badge">
      dismissed: {{ swipeCount() }}
    </span>
  </div>`,
    },
  ],
};
