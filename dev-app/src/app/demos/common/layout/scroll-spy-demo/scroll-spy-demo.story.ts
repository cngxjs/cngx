import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Scroll Spy',
  navLabel: 'ScrollSpy',
  navCategory: 'layout',
  description:
    'Tracks which section is most visible in the viewport. Ideal for scroll-based navigation highlighting.',
  apiComponents: ['CngxScrollSpy'],
  overview:
    '<p><code>[cngxScrollSpy]</code> observes section elements by ID using <code>IntersectionObserver</code> ' +
    'and reports the one with the highest visibility ratio. Pairs naturally with <code>CngxNavLink</code> for navigation highlighting.</p>',
  moduleImports: [
    "import { CngxScrollSpy } from '@cngx/common/layout';",
  ],
  setup: `
  protected readonly sectionIds = ['spy-intro', 'spy-features', 'spy-pricing', 'spy-faq'];

  protected scrollTo(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  `,
  sections: [
    {
      title: 'Scroll-Based Navigation',
      subtitle:
        'Scroll the container. The nav highlights the most visible section. Active section ID is exposed as a signal.',
      imports: ['CngxScrollSpy'],
      template: `
  <div style="display:flex;gap:16px;max-width:600px">
    <nav [cngxScrollSpy]="sectionIds" [root]="'.spy-container'" [threshold]="0.1" #spy="cngxScrollSpy"
         style="position:sticky;top:0;display:flex;flex-direction:column;gap:4px;min-width:100px;padding-top:8px">
      @for (id of sectionIds; track id) {
        <a href="javascript:void(0)"
           (click)="scrollTo($event, id)"
           class="chip"
           [class.chip--active]="spy.activeId() === id"
           style="text-decoration:none;font-size:0.8125rem;text-transform:capitalize">
          {{ id.replace('spy-', '') }}
        </a>
      }
    </nav>
    <div class="spy-container" style="height:300px;overflow-y:auto;flex:1;border:1px solid var(--cngx-border,#ddd);border-radius:8px">
      @for (id of sectionIds; track id) {
        <section [id]="id" style="min-height:200px;padding:20px;border-bottom:1px solid var(--cngx-border,#eee)">
          <h3 style="margin:0 0 8px;text-transform:capitalize">{{ id.replace('spy-', '') }}</h3>
          <p style="color:var(--cngx-text-secondary,#666);font-size:0.875rem">
            Scroll through this section to see the nav update.
            This section has enough height to demonstrate the intersection ratio tracking.
          </p>
        </section>
      }
    </div>
  </div>
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active section</span>
      <span class="event-value">{{ spy.activeId() ?? 'none' }}</span>
    </div>
  </div>`,
    },
  ],
};
